import { useEffect, useState } from "react"; 
import { Star } from "lucide-react"; 
import { supabase} from './lib/supabase.js'; 


export default function RateService({ user, onNavigate, reportId }) { 
  const [reports, setReports] = useState([]); 
  const [rating, setRating] = useState({}); 
  const [comment, setComment] = useState({}); 


  useEffect(() => { 
    console.log("RateService: User prop:", user);
    if (user?.id) { 
      loadResolvedReports(); 
    } else {
      console.warn("RateService: No user.id found in props");
    }
  }, [user, reportId]); 


 const loadResolvedReports = async () => { 
   console.log("Cargando reportes para usuario:", user.id);

   // 🔍 DIAGNÓSTICO: Traer TODOS los reportes de este usuario para ver sus estados reales
    // (Oculto para limpiar la consola, descomentar si hay problemas)
    /*
    const { data: allUserReports } = await supabase
      .from("reports")
      .select("id, status, citizen_rating")
      .eq("user_id", user.id);
    console.log("🔍 DIAGNÓSTICO (DETALLES):", JSON.stringify(allUserReports, null, 2));
    */

    let query = supabase 
      .from("reports") 
      .select("id, title, tracking_code, status, citizen_rating, citizen_comment") 
      .eq("user_id", user.id)
      .in("status", ["resolved", "Resolved", "RESOLVED", "Resuelto", "RESUELTO", "received", "Received", "RECEIVED", "Recibido"])
      .is("citizen_rating", null) // ✅ Solo mostrar reportes NO calificados
      .order("created_at", { ascending: false });

    // Si nos pasan un ID específico, filtramos solo ese reporte
    if (reportId) {
      query = query.eq("id", reportId);
    }

    const { data, error } = await query;

    console.log("Resultado Supabase:", { data, error });

    if (error) { 
      console.error("Error cargando reportes:", error); 
      return; 
    } 

    setReports(data || []);

    // Inicializar calificaciones existentes si las hay
    if (data) {
      const initialRatings = {};
      const initialComments = {};
      data.forEach(r => {
        if (r.citizen_rating) initialRatings[r.id] = r.citizen_rating;
        if (r.citizen_comment) initialComments[r.id] = r.citizen_comment;
      });
      setRating(prev => ({ ...prev, ...initialRatings }));
      setComment(prev => ({ ...prev, ...initialComments }));
    }
  }; 



 const submitRating = async (id) => { 
  if (!rating[id]) { 
    alert("Selecciona una calificación"); 
    return; 
  } 


  const { data, error } = await supabase 
    .from("reports") 
    .update({ 
      citizen_rating: Number(rating[id]), 
      citizen_comment: comment[id]?.trim() || null, 
      rated_ad: new Date().toISOString() 
    }) 
    .eq("id", id) 
    .select(); // 👈 IMPORTANTE para ver errores reales 


  if (error) { 
    console.error("Error enviando calificación:", error); 
    alert(error.message); 
    return; 
  } 


  alert("Gracias por tu calificación 🙌"); 
  loadResolvedReports(); 
}; 


  return ( 


    
    <div className="min-h-screen bg-gray-100 p-6 max-w-3xl mx-auto"> 
      <h2 className="text-2xl font-bold mb-6">⭐ Calificar servicio</h2> 


      {reports.length === 0 ? ( 
        <p className="text-gray-600"> 
          No tienes reportes pendientes por calificar. 
        </p> 
      ) : ( 
        reports.map((r) => ( 
          <div key={r.id} className="bg-white p-5 rounded-xl shadow mb-4"> 
            <p className="font-semibold">{r.title}</p> 
            <p className="text-sm text-gray-500 mb-3"> 
              Código: {r.tracking_code} 
            </p> 


            <div className="flex gap-1 mb-3"> 
              {[1, 2, 3, 4, 5].map((value) => ( 
                <Star 
                  key={value} 
                  onClick={() => 
                    setRating({ ...rating, [r.id]: value }) 
                  } 
                  className={`w-6 h-6 cursor-pointer ${ 
                    rating[r.id] >= value 
                      ? "text-yellow-400" 
                      : "text-gray-300" 
                  }`} 
                /> 
              ))} 
            </div> 


            <textarea 
              placeholder="Comentario opcional..." 
              className="w-full border rounded-lg p-2 mb-3" 
              onChange={(e) => 
                setComment({ ...comment, [r.id]: e.target.value }) 
              } 
            /> 


            <button 
              onClick={() => submitRating(r.id)} 
              className="bg-green-500 text-white px-4 py-2 rounded-lg" 
            > 
              Enviar calificación 
            </button> 
          </div> 
        )) 
      )} 


      <button 
        onClick={() => onNavigate("citizen")} 
        className="mt-6 text-blue-600 underline" 
      > 
        ← Volver 
      </button> 
    </div> 
  ); 
} 
